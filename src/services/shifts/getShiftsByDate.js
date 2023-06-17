import supabase from "../../supabaseClient.js";

export const getShiftsByDate = async (req, res) => {
  // route is /shifts/2021-01-01
  const { date } = req.params;

  const { data, error } = await supabase
    .from("calendar_shift_logs")
    .select("*, employees(*), roles(*)")
    .eq("date", date);

  if (error) {
    res.status(423).send({ error });
  }

  // if there are calendar shift logs, return data
  // else, find shifts based on day of week
  if (data.length > 0) {
    return res.send({ data });
  }

  // get day of week
  const weekday = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const dayOfWeek = weekday[new Date(date).getDay()];

  // get shifts based on day of week
  const { data: shiftData, error: shiftError } = await supabase
    .from("shifts")
    .select("*, shift_role(*, roles(*))")
    .eq(dayOfWeek, true);

  if (shiftError) {
    res.status(423).send({ error: shiftError });
  }

  res.send({ data: shiftData });
};
