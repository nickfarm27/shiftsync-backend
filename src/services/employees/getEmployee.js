import supabase from "../../supabaseClient.js";

export const getEmployee = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("employees")
    .select("*, roles(name)")
    .eq("id", id);

  if (error) {
    res.status(423).send({ error });
  }

  res.send({ data });
};
