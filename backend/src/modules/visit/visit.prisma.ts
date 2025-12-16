export const visitIncludeForOwnerList = {
  pet: true,
  sitter: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  },
} as const;

export const visitIncludeForSitterList = {
  pet: true,
  owner: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  },
} as const;

export const visitIncludeForSitterStatusUpdate = {
  pet: true,
  owner: {
    select: {
      id: true,
      name: true,
      phone: true,
    },
  },
} as const;
