import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, Share } from "react-native";
import { api } from "../../src/config/api";
import { useTheme } from "../../src/config/theme";

interface FileItem {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  visibility: string;
  url?: string;
  createdAt: string;
}

export default function FilesScreen() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { colors } = useTheme();

  const fetchFiles = async () => {
    try {
      const res = await api.files.list({ page: 1, limit: 30 });
      if (res.success) {
        setFiles(res.data.items || []);
      }
    } catch (err) {
      console.error("Error fetching files:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFiles();
  };

  const handleMockUpload = (visibility: "PRIVATE" | "TENANT" | "PUBLIC") => {
    Alert.alert(
      "Subir Archivo",
      "Selecciona un archivo simulado para cargar al almacenamiento seguro:",
      [
        {
          text: "Contrato de Inquilino (PDF)",
          onPress: () => performUpload("contrato_inquilino.pdf", "application/pdf", "%PDF-1.4 ...Mock PDF Content...", visibility),
        },
        {
          text: "Reporte Mensual (CSV)",
          onPress: () => performUpload("reporte_mensual.csv", "text/csv", "id,name,value\n1,Ventas,100\n2,Costos,50\n", visibility),
        },
        {
          text: "Imagen Perfil (PNG)",
          onPress: () => performUpload("imagen_perfil.png", "image/png", "MockPNGBytes", visibility),
        },
        { text: "Cancelar", style: "cancel" },
      ]
    );
  };

  const performUpload = async (filename: string, mime: string, content: string, visibility: "PRIVATE" | "TENANT" | "PUBLIC") => {
    setUploading(true);
    try {
      const blob = new Blob([content], { type: mime });
      const res = await api.files.upload(blob, filename, visibility);
      if (res.success) {
        Alert.alert("Éxito", `El archivo ${filename} se subió correctamente.`);
        fetchFiles();
      } else {
        Alert.alert("Error", res.error?.message || "No se pudo subir el archivo.");
      }
    } catch (err: any) {
      Alert.alert("Error de Conexión", err.message || "Error al subir.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      "Eliminar Archivo",
      `¿Estás seguro de que deseas eliminar permanentemente ${name}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await api.files.delete(id);
              if (res.success) {
                setFiles((prev) => prev.filter((f) => f.id !== id));
              }
            } catch (err) {
              console.error("Error deleting file:", err);
            }
          },
        },
      ]
    );
  };

  const handleShare = async (url?: string) => {
    if (!url) {
      Alert.alert("Error", "El archivo no tiene una URL de acceso válida.");
      return;
    }
    try {
      await Share.share({
        message: `Accede a mi archivo seguro en BaseForge: ${url}`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const renderFileCard = ({ item }: { item: FileItem }) => {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardEmoji}>
            {item.mimeType.includes("image") ? "🖼️" : item.mimeType.includes("pdf") ? "📄" : "📂"}
          </Text>
          <View style={styles.cardInfo}>
            <Text style={[styles.filename, { color: colors.text }]} numberOfLines={1}>
              {item.originalName}
            </Text>
            <Text style={[styles.subtext, { color: colors.textMuted }]}>
              {formatBytes(item.sizeBytes)} • {item.mimeType}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={[styles.visibilityBadge, { backgroundColor: item.visibility === "PUBLIC" ? "#10b98120" : item.visibility === "TENANT" ? "#3b82f620" : "#f59e0b20" }]}>
            <Text style={[styles.visibilityText, { color: item.visibility === "PUBLIC" ? "#10b981" : item.visibility === "TENANT" ? "#3b82f6" : "#f59e0b" }]}>
              {item.visibility}
            </Text>
          </View>
          
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => handleShare(item.url)} style={styles.actionBtn}>
              <Text style={{ fontSize: 16 }}>🔗</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id, item.originalName)} style={styles.actionBtn}>
              <Text style={{ fontSize: 16 }}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Mis Archivos</Text>
        <TouchableOpacity
          onPress={() => handleMockUpload("PRIVATE")}
          style={[styles.uploadButton, { backgroundColor: colors.primary }]}
          disabled={uploading}
        >
          <Text style={styles.uploadButtonText}>
            {uploading ? "Cargando..." : "+ Subir"}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={files}
          renderItem={renderFileCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centerEmpty}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>📂</Text>
              <Text style={[styles.emptyText, { color: colors.text }]}>No hay archivos aún</Text>
              <Text style={{ color: colors.textMuted, textAlign: "center", paddingHorizontal: 32 }}>
                Sube archivos seguros asociados con aislamiento completo a tu tenant.
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },
  uploadButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cardEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  filename: {
    fontSize: 15,
    fontWeight: "bold",
  },
  subtext: {
    fontSize: 12,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
    paddingTop: 12,
  },
  visibilityBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  visibilityText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    padding: 6,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centerEmpty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },
});
