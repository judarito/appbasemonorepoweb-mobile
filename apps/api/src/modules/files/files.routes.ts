import { Hono } from "hono";
import { FilesController } from "./files.controller";
import { requireAuth } from "../../middlewares/auth";
import { tenantContext } from "../../middlewares/tenant";

const router = new Hono<{ Variables: { traceId: string } }>();
const controller = new FilesController();

// Ruta de descarga local que no requiere autenticación directa en cabeceras 
// ya que lee el archivo desde el disco según los parámetros de la URL.
router.get("/local-download", controller.localDownload);

// Middleware para proteger las operaciones del API de archivos
router.use("/upload", requireAuth);
router.use("/upload", tenantContext);

router.use("/", requireAuth);
router.use("/", tenantContext);

router.use("/:id", requireAuth);
router.use("/:id", tenantContext);

router.post("/upload", controller.uploadFile);
router.get("/", controller.listFiles);
router.get("/:id", controller.getFile);
router.delete("/:id", controller.deleteFile);

export const filesRoutes = router;
