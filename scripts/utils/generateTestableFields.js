function generateTestableFields(n) {
  let fields = [];
  for (let i = 0; i < n; i++) {
    fields[i] = { name: `Field ${i + 1}`, id: `field_${i + 1}`, type: "text" };
  }

  return fields;
}

export default generateTestableFields;
