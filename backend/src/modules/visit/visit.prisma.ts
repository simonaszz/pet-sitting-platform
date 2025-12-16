export const visitIncludeForOwnerList = {
  visitPets: {
    include: {
      pet: true,
    },
  },
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
  visitPets: {
    include: {
      pet: true,
    },
  },
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
  visitPets: {
    include: {
      pet: true,
    },
  },
  owner: {
    select: {
      id: true,
      name: true,
      phone: true,
    },
  },
} as const;
