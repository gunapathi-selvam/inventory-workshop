/**
 * Custom-field service. Validates a customFields payload against the active
 * FieldDefinition rows for an entity so runtime-defined fields are enforced the
 * same way as built-in ones. Used by customer/user/order create & update.
 */
import { prisma, type Prisma } from "@workshop/db";
import { errors, type CustomFieldEntity } from "@workshop/core";

export async function getFieldDefinitions(entity: CustomFieldEntity) {
  return prisma.fieldDefinition.findMany({
    where: { entity, active: true },
    orderBy: { order: "asc" },
  });
}

/**
 * Validates + coerces the incoming customFields against definitions. Unknown
 * keys are dropped; required fields are enforced; SELECT values are checked.
 */
export async function validateCustomFields(
  entity: CustomFieldEntity,
  input: Record<string, unknown> | undefined,
): Promise<Prisma.InputJsonValue> {
  const defs = await getFieldDefinitions(entity);
  const data = input ?? {};
  const out: Record<string, unknown> = {};
  const fieldErrors: Record<string, string> = {};

  for (const def of defs) {
    const raw = data[def.key];
    const provided = raw !== undefined && raw !== null && raw !== "";

    if (!provided) {
      if (def.required) fieldErrors[def.key] = `${def.label} is required`;
      continue;
    }

    switch (def.type) {
      case "NUMBER": {
        const n = Number(raw);
        if (Number.isNaN(n)) fieldErrors[def.key] = `${def.label} must be a number`;
        else out[def.key] = n;
        break;
      }
      case "BOOLEAN":
        out[def.key] = Boolean(raw);
        break;
      case "DATE": {
        const d = new Date(raw as string);
        if (Number.isNaN(d.getTime())) fieldErrors[def.key] = `${def.label} must be a date`;
        else out[def.key] = d.toISOString();
        break;
      }
      case "SELECT": {
        const options = (def.options as string[] | null) ?? [];
        if (!options.includes(String(raw))) fieldErrors[def.key] = `${def.label} has an invalid option`;
        else out[def.key] = String(raw);
        break;
      }
      default:
        out[def.key] = String(raw);
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw errors.validation("Custom field validation failed", { fields: fieldErrors });
  }
  return out as Prisma.InputJsonValue;
}
