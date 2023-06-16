import supabase from "../../supabaseClient.js";

export const createRole = async (req, res) => {
  const { name } = req.body;

  const { data, error } = await supabase
    .from("roles")
    .insert({
      name,
    })
    .select("*");

  if (error) {
    res.status(423).send({ error });
  }

  res.status(201).send({ data });
};
