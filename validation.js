function readText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateContactForm(input = {}) {
  const values = {
    name: readText(input.name),
    email: readText(input.email),
    phone: readText(input.phone),
    message: readText(input.message)
  };
  const errors = {};

  if (!values.name) {
    errors.name = "Full name is required.";
  } else if (values.name.length < 3) {
    errors.name = "Full name must contain at least 3 characters.";
  } else if (!/^[A-Za-z ]+$/.test(values.name)) {
    errors.name = "Full name can contain only letters and spaces.";
  }

  if (!values.email) {
    errors.email = "Email address is required.";
  } else if (values.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.phone) {
    errors.phone = "Phone number is required.";
  } else if (!/^\d{10}$/.test(values.phone)) {
    errors.phone = "Phone number must contain exactly 10 digits.";
  }

  if (!values.message) {
    errors.message = "Message is required.";
  } else if (values.message.length < 10) {
    errors.message = "Message must contain at least 10 characters.";
  } else if (values.message.length > 500) {
    errors.message = "Message must not exceed 500 characters.";
  }

  return { values, errors };
}
