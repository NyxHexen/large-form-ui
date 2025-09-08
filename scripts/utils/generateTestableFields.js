function generateTestableFields(n) {
  // Enterprise-focused field names for realistic testing
  const enterpriseFields = [
    { name: "Customer ID", id: "customer_id", type: "text" },
    { name: "First Name", id: "first_name", type: "text" },
    { name: "Last Name", id: "last_name", type: "text" },
    { name: "Email Address", id: "email", type: "email" },
    { name: "Phone Number", id: "phone", type: "text" },
    { name: "Account Number", id: "account_number", type: "text" },
    { name: "Policy Number", id: "policy_number", type: "text" },
    { name: "Claim ID", id: "claim_id", type: "text" },
    { name: "Date of Birth", id: "date_of_birth", type: "date" },
    { name: "Hire Date", id: "hire_date", type: "date" },
    { name: "Effective Date", id: "effective_date", type: "date" },
    { name: "Expiry Date", id: "expiry_date", type: "date" },
    { name: "Date of Loss", id: "date_of_loss", type: "date" },
    { name: "SSN", id: "ssn", type: "text" },
    { name: "License Number", id: "license_number", type: "text" },
    { name: "ZIP Code", id: "zip_code", type: "text" },
    { name: "State", id: "state", type: "text" },
    { name: "City", id: "city", type: "text" },
    { name: "Address", id: "address", type: "text" },
    { name: "Company", id: "company", type: "text" },
    { name: "Department", id: "department", type: "text" },
    { name: "Position", id: "position", type: "text" },
    { name: "Employee ID", id: "employee_id", type: "text" },
    { name: "Badge Number", id: "badge_number", type: "text" },
    { name: "VIN", id: "vin", type: "text" },
    { name: "License Plate", id: "license_plate", type: "text" },
    { name: "Reference Number", id: "reference_number", type: "text" },
    { name: "Incident Date", id: "incident_date", type: "date" },
    { name: "Case Number", id: "case_number", type: "text" },
    { name: "Contract ID", id: "contract_id", type: "text" },
    { name: "Invoice Number", id: "invoice_number", type: "text" },
    { name: "Order ID", id: "order_id", type: "text" },
    { name: "Service Date", id: "service_date", type: "date" },
    { name: "Appointment Date", id: "appointment_date", type: "date" },
    { name: "Priority Level", id: "priority_level", type: "text" },
    { name: "Status", id: "status", type: "text" },
    { name: "Region", id: "region", type: "text" }
  ];

  let fields = [];
  
  // Use enterprise fields first
  for (let i = 0; i < Math.min(n, enterpriseFields.length); i++) {
    fields.push(enterpriseFields[i]);
  }
  
  // Fill remaining with generic fields if needed
  for (let i = enterpriseFields.length; i < n; i++) {
    fields.push({ name: `Field ${i + 1}`, id: `field_${i + 1}`, type: "text" });
  }

  return fields;
}

export default generateTestableFields;
