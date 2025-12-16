export const sitterProfileIncludeWithUserPublic = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
    },
  },
} as const;

export const sitterProfileIncludeForCreateOrUpdate = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} as const;

export const sitterProfileIncludeForList = {
  user: {
    select: {
      id: true,
      name: true,
      avatar: true,
    },
  },
} as const;
