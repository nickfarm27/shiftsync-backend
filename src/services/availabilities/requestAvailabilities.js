import supabase from "../../supabaseClient.js";
import axios from "axios";

export const requestAvailabilities = async (req, res) => {
  // post route, /:date/request_availabilities

  // get the date from the params
  const { date } = req.params;

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

  // get all shifts for that day of the week
  const { data: shiftData, error: shiftError } = await supabase
    .from("shifts")
    .select("*, shift_role(*, roles(*))")
    .eq(dayOfWeek, true);

  if (shiftError) {
    res.status(423).send({ error: shiftError, type: "shiftError" });
  }

  // save all the roles in a const, make sure its not duplicated
  const roles = shiftData.map((shift) => {
    return shift.shift_role.map((shiftRole) => {
      return shiftRole.role_id;
    });
  });

  // flatten the array
  const flatRoles = roles.flat();

  // remove duplicates
  const uniqueRoles = [...new Set(flatRoles)];

  // create calendar shift logs for each shift_role, one for each employee
  const calendarShiftLogs = shiftData.map((shift) => {
    return shift.shift_role.map((shiftRole) => {
      return {
        date: date,
        start_time: shift.start_time,
        end_time: shift.end_time,
        role_id: shiftRole.role_id,
        shift_name: shift.name,
      };
    });
  });

  // flatten the array
  const flatCalendarShiftLogs = calendarShiftLogs.flat();

  // insert the calendar shift logs
  const { data: calendarShiftLogsData, error: calendarShiftLogsError } =
    await supabase
      .from("calendar_shift_logs")
      .insert(flatCalendarShiftLogs)
      .select("*");

  if (calendarShiftLogsError) {
    res
      .status(423)
      .send({ error: calendarShiftLogsError, type: "calendarShiftLogsError" });
  }

  // create employee_availability_requests for employees with roles in uniqueRoles
  // get all roles based on uniqueRoles
  const { data: roleData, error: roleError } = await supabase
    .from("roles")
    .select("*, employees(*)")
    .in("id", uniqueRoles);

  if (roleError) {
    res.status(423).send({ error: roleError, type: "roleError" });
  }

  // save all the employee_ids in a const, make sure its not duplicated
  const employees = roleData
    .map((role) => {
      return role.employees.map((employee) => {
        return employee.id;
      });
    })
    .flat();

  // remove duplicates
  const uniqueEmployees = [...new Set(employees)];

  // create employee_availability_requests object, one for each employee
  const employeeAvailabilityRequests = uniqueEmployees.map((employee) => {
    return {
      employee_id: employee,
      date: date,
    };
  });

  // insert the employee_availability_requests
  const {
    data: employeeAvailabilityRequestsData,
    error: employeeAvailabilityRequestsError,
  } = await supabase
    .from("employee_availability_requests")
    .insert(employeeAvailabilityRequests)
    .select("*");

  if (employeeAvailabilityRequestsError) {
    res.status(423).send({
      error: employeeAvailabilityRequestsError,
      type: "employeeAvailabilityRequestsError",
    });
  }

  // get all the phone numbers of the employees
  const employeePhoneNumbers = roleData
    .map((role) => {
      return role.employees.map((employee) => {
        return employee.phone_number;
      });
    })
    .flat();

  // remove duplicates
  const uniqueEmployeePhoneNumbers = [...new Set(employeePhoneNumbers)];

  // create the message body
  // Format:
  // Here are the timings available for {{date}}: 10:00 AM - 2:00 PM (Shift Name 1), 12:00 PM - 5:00 PM (Shift Name 2), 2:00 PM - 9:00 PM (Shift Name 3).  Please respond with the shift names that you would prefer in this format.

  // For 1 shift only:
  // Shift Name 1

  // For more than one shift:
  // Shift Name 1,Shift Name 2

  // capitalize the first letter of the day of week
  const capitalizedDayOfWeek =
    dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);

  const allShiftTimesAndNames = shiftData.map((shift) => {
    return `${shift.start_time} - ${shift.end_time} (${shift.name})\n`;
  });
  // remove commas from allShiftTimesAndNames
  const allShiftTimesAndNamesString = allShiftTimesAndNames.join("");

  const msgBody = `Here are the timings available for ${date} (${capitalizedDayOfWeek}): \n\n${allShiftTimesAndNamesString}\nPlease respond with the shift names that you would prefer in this format.\n\nFor 1 shift only:\nShift Name 1\n\nFor more than one shift:\nShift Name 1,Shift Name 2`;

  // send whatsapp messages to each employee unique phone numbers to ask for their availability
  uniqueEmployeePhoneNumbers.forEach((phoneNumber) => {
    axios({
      method: "POST", // Required, HTTP method, a string, e.g. POST, GET
      url: `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      data: {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: phoneNumber,
        type: "text",
        text: { preview_url: false, body: msgBody },
      },
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + process.env.WHATSAPP_TOKEN,
      },
    });
  });

  res.status(200).send({ data: { success: true } });
};
