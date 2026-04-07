export const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) {
    return '-';
  }

  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
  }).format(date);
};

export const formatDateTime = (value: string | Date | null | undefined): string => {
  if (!value) {
    return '-';
  }

  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

