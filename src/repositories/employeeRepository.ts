import { db } from "@/db";
import { employees, roleEnum } from "@/db/schema";
import { eq } from "drizzle-orm";

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
export type EmployeeRole = (typeof roleEnum.enumValues)[number];

export const employeeRepository = {
  async findAll(): Promise<Employee[]> {
    return await db.select().from(employees);
  },

  async findById(id: number): Promise<Employee | null> {
    const result = await db.select().from(employees).where(eq(employees.id, id));
    return result[0] || null;
  },

  async findByRole(role: EmployeeRole): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.role, role));
  },

  async create(data: NewEmployee): Promise<Employee> {
    const result = await db.insert(employees).values(data).returning();
    return result[0];
  },
};
