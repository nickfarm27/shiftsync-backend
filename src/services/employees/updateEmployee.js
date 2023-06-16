import supabase from "../../supabaseClient.js";

export const updateEmployee = async (req, res) => {
  const { id } = req.params;
  const { name, phoneNumber, hourlyRate, roleIds } = req.body;

  const { data, error } = await supabase
    .from("employees")
    .update({
      name,
      phone_number: phoneNumber,
      hourly_rate: hourlyRate,
    })
    .eq("id", id)
    .select("*, roles(id, name)");

  if (error) {
    res.status(423).send({ error });
  }

  // update employee_role table
  const currentRoles = data[0].roles;

  // destroy employee_role for the roles that are not in the new roleIds
  const rolesToDestroy = currentRoles.filter((role) => {
    return !roleIds.includes(role.id);
  });
  const rolesToDestroyIds = rolesToDestroy.map((role) => role.id);

  const { error: destroyError } = await supabase
    .from("employee_role")
    .delete()
    .in("role_id", rolesToDestroyIds)
    .eq("employee_id", id);

  if (destroyError) {
    res.status(423).send({ error: destroyError });
  }

  // create employee_role for the roles that are in the new roleIds
  const rolesToCreate = roleIds.filter((roleId) => {
    return !currentRoles.map((role) => role.id).includes(roleId);
  });

  const employeeRoles = rolesToCreate.map((roleId) => {
    return {
      employee_id: id,
      role_id: roleId,
    };
  });

  const { data: employeeRolesData, error: employeeRolesError } = await supabase
    .from("employee_role")
    .insert(employeeRoles)
    .select("*, roles(id, name)");

  if (employeeRolesError) {
    res.status(423).send({ error: employeeRolesError });
  }

  res.send({ data });
};
