import supabase from "../../supabaseClient.js";

export const getShifts = async (req, res) => {
  const { data, error } = await supabase
    .from("shifts")
    .select("*, shift_role(*, roles(*))");

  if (error) {
    res.status(423).send({ error });
  }
  res.send({ data });
};
