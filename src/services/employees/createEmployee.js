import supabase from "../../supabaseClient.js";

export const createEmployee = async (req, res) => {
  const { name, phoneNumber, hourlyRate, roleIds } = req.body;

  const { data, error } = await supabase
    .from("employees")
    .insert({
      name,
      phone_number: phoneNumber,
      hourly_rate: hourlyRate,
    })
    .select("*");

  if (error) {
    res.status(423).send({ error });
  }

  const employeeId = data[0].id;
  const employeeRoles = roleIds.map((roleId) => {
    return {
      employee_id: employeeId,
      role_id: roleId,
    };
  });

  const { data: employeeRolesData, error: employeeRolesError } = await supabase
    .from("employee_role")
    .insert(employeeRoles)
    .select("*, roles(name)");

  if (employeeRolesError) {
    res.status(423).send({ error: employeeRolesError });
  }

  // fetch all employees data
  const { data: employeeData, error: employeeError } = await supabase
    .from("employees")
    .select("*, roles(*)");

  if (employeeError) {
    res.status(423).send({ error: employeeError });
  }

  res.status(201).send({ data: employeeData });
};
