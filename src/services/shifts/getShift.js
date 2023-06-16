import supabase from "../../supabaseClient.js";

export const getShift = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("shifts")
    .select("*, shift_role(*, roles(*))")
    .eq("id", id);

  if (error) {
    res.status(423).send({ error });
  }
  res.send({ data });
};
