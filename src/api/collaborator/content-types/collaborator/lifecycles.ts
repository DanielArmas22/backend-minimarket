export default {
  async beforeDelete(event) {
    const ids = await resolveTargetIds(event);
    for (const id of ids) {
      await assertNoActiveLinks(id);
    }
  },
  async beforeDeleteMany(event) {
    const ids = await resolveTargetIds(event);
    for (const id of ids) {
      await assertNoActiveLinks(id);
    }
  },
};

async function resolveTargetIds(event): Promise<number[]> {
  const where = event.params?.where || {};
  if (typeof where.id === 'number') return [where.id];
  if (Array.isArray(where.id?.$in)) return where.id.$in;

  const items = await strapi.entityService.findMany('api::collaborator.collaborator', {
    filters: where,
    fields: ['id'],
  });
  return (items as any[]).map((i) => i.id);
}

async function assertNoActiveLinks(collaboratorId: number) {
  const collaborator = await strapi.entityService.findOne('api::collaborator.collaborator', collaboratorId, {
    populate: ['users_permissions_user'],
  });
  const user = (collaborator as any)?.users_permissions_user;
  if (!user?.id) return;

  // Verificar cajas abiertas asociadas al usuario
  const openRegisters = await strapi.entityService.findMany('api::cash-register.cash-register', {
    filters: {
      users_permissions_user: { id: user.id },
      status: 'open',
    },
    fields: ['id'],
    limit: 1,
  });

  if (Array.isArray(openRegisters) && openRegisters.length > 0) {
    throw new Error('No se puede eliminar. El colaborador tiene operaciones asociadas (cajas sin cerrar). Sugerimos desactivarlo.');
  }
}


