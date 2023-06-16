import supabase from "../../supabaseClient.js";

export const createShift = async (req, res) => {
  // shape of roles
  // [{ id: 1, noOfEmployees: 2 }, { id: 2, noOfEmployees: 3}]

  const {
    name,
    // "10:00:00 AM" <- time format
    startTime,
    endTime,
    monday,
    tuesday,
    wednesday,
    thursday,
    friday,
    saturday,
    sunday,
    roles,
  } = req.body;

  const { data, error } = await supabase
    .from("shifts")
    .insert({
      name,
      start_time: startTime,
      end_time: endTime,
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday,
      sunday,
    })
    .select("*");

  if (error) {
    res.status(423).send({ error });
  }

  const shiftRoles = roles.map((shift) => {
    return {
      shift_id: data[0].id,
      role_id: shift.id,
      number_of_employees: shift.noOfEmployees,
    };
  });

  const { data: shiftRolesData, error: shiftRolesError } = await supabase
    .from("shift_role")
    .insert(shiftRoles)
    .select("*, roles(*)");

  if (shiftRolesError) {
    res.status(423).send({ error: shiftRolesError });
  }

  // fetch the new shift with the roles
  const { data: shiftData, error: shiftError } = await supabase
    .from("shifts")
    .select("*, shift_role(*, roles(*))")
    .eq("id", data[0].id);

  if (shiftError) {
    res.status(423).send({ error: shiftError });
  }

  res.status(201).send({ data: shiftData });
};
