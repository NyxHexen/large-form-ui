function generateTestableFields(n) {
  let fields = [];
  for (let i = 0; i < n + 1; i++) {
    fields[i] = { name: `Field ${i + 1}`, id: `field_${i + 1}` };
  }

  return fields;
}

export default generateTestableFields;
