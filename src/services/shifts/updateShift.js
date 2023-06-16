import supabase from "../../supabaseClient.js";

export const updateShift = async (req, res) => {
  // shape of roles
  // [{ id: 1, noOfEmployees: 2 }, { id: 2, noOfEmployees: 3}]

  const { id } = req.params;
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
    .update({
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
    .eq("id", id)
    .select("*, shift_role(*, roles(*))");

  if (error) {
    res.status(423).send({ error });
  }

  // delete all shift_role records for this shift
  const { data: deleteData, error: deleteError } = await supabase
    .from("shift_role")
    .delete()
    .eq("shift_id", id);

  if (deleteError) {
    res.status(423).send({ error: deleteError, type: "delete" });
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
    res.status(423).send({ error: shiftRolesError, type: "insert" });
  }

  // fetch the new shift with the roles
  const { data: shiftData, error: shiftError } = await supabase
    .from("shifts")
    .select("*, shift_role(*, roles(*))")
    .eq("id", id);

  if (shiftError) {
    res.status(423).send({ error: shiftError, type: "fetch" });
  }

  res.status(201).send({ data: shiftData });
};
