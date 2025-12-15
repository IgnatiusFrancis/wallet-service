let counter = 0;

jest.mock('uuid', () => ({
  v4: () => {
    counter += 1;
    return `00000000-0000-0000-0000-${counter.toString().padStart(12, '0')}`;
  },
}));
