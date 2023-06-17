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
    return; // Return early to avoid further execution
  }

  // Fetch the updated list of data from the "roles" table
  const { data: allData, error: fetchError } = await supabase
    .from("roles")
    .select("*");

  if (fetchError) {
    res.status(500).send({ error: fetchError });
    return; // Return early to avoid further execution
  }

  res.status(201).send({ data: allData });
};
