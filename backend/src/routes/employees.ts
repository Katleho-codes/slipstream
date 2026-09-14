import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
    createEmployee,
    CreateEmployeeSchema,
    deleteEmployee,
    getEmployee,
    getEmployees,
    updateEmployee,
    UpdateEmployeeSchema,
} from "../controllers/employee.controller";

const router = Router();

router.get("/employees", requireAuth, getEmployees);
router.get("/employees/:id", requireAuth, getEmployee);
router.post(
    "/employees",
    requireAuth,
    requireRole("OWNER", "ADMIN"),
    validate(CreateEmployeeSchema),
    createEmployee,
);
router.patch(
    "/employees/:id",
    requireAuth,
    requireRole("OWNER", "ADMIN"),
    validate(UpdateEmployeeSchema),
    updateEmployee,
);
router.delete(
    "/employees/:id",
    requireAuth,
    requireRole("OWNER", "ADMIN"),
    deleteEmployee,
);

export default router;