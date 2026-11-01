import {prisma} from "@/lib/prisma";
import {jsonError} from "@/lib/http";
import {safeJsonParse} from "@/lib/reliability";

export async function GET(_request, {params}) {
  const event = await prisma.event.findUnique({
    where: {id: params.id},
    select: {
      id: true,
      type: true,
      payload: true,
      createdAt: true,
      deliveries: {
        orderBy: {createdAt: "asc"},
        select: {
          id: true,
          status: true,
          attemptCount: true,
          maxAttempts: true,
          nextAttemptAt: true,
          lastStatusCode: true,
          lastError: true,
          deliveredAt: true,
          createdAt: true,
          updatedAt: true,
          endpoint: {
            select: {id: true, name: true, url: true, enabled: true}
          },
          attempts: {
            orderBy: [{createdAt: "asc"}, {attemptNumber: "asc"}],
            select: {
              id: true,
              attemptNumber: true,
              status: true,
              statusCode: true,
              responseBody: true,
              error: true,
              durationMs: true,
              createdAt: true
            }
          }
        }
      }
    }
  });

  if (!event) return jsonError("Event not found.", 404);

  return Response.json({
    event: {
      ...event,
      payload: safeJsonParse(event.payload, {})
    }
  });
}
