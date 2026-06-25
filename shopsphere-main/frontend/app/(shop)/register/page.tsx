"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card, { CardHeader } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

export default function RegisterPage() {
const {
register,
isAuthenticated,
loading: authLoading,
} = useAuth();

const router = useRouter();

const [form, setForm] = useState({
name: "",
email: "",
phone: "",
password: "",
password_confirmation: "",
});

const [error, setError] = useState("");
const [fieldErrors, setFieldErrors] = useState<
Record<string, string>

> ({});
 const [loading, setLoading] = useState(false);

useEffect(() => {
if (!authLoading && isAuthenticated) {
router.replace("/");
}
}, [authLoading, isAuthenticated, router]);

async function handleSubmit(
event: FormEvent<HTMLFormElement>,
) {
event.preventDefault();

setLoading(true);
setError("");
setFieldErrors({});

try {
  await register(form);

  alert("Registration successful. Please log in.");
  router.push("/login");
} catch (err) {
  if (err instanceof ApiError && err.errors) {
    const mappedErrors: Record<string, string> = {};

    Object.entries(err.errors).forEach(
      ([field, messages]) => {
        mappedErrors[field] = messages[0];
      },
    );

    setFieldErrors(mappedErrors);
  } else {
    setError(
      err instanceof ApiError
        ? err.message
        : "Registration failed",
    );
  }
} finally {
  setLoading(false);
}
}

if (authLoading || isAuthenticated) {
return ( <div className="flex min-h-[60vh] items-center justify-center"> <p className="text-muted">Loading...</p> </div>
);
}

return ( <div className="mx-auto flex min-h-[60vh] max-w-md items-center px-4 py-12"> <Card className="w-full" padding="lg"> <CardHeader
       title="Create Account"
       subtitle="Join ShopSphere today"
     />

```
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <Input
        label="Full Name"
        required
        value={form.name}
        onChange={(event) =>
          setForm({
            ...form,
            name: event.target.value,
          })
        }
        error={fieldErrors.name}
      />

      <Input
        label="Email"
        type="email"
        required
        value={form.email}
        onChange={(event) =>
          setForm({
            ...form,
            email: event.target.value,
          })
        }
        error={fieldErrors.email}
      />

      <Input
        label="Phone"
        type="tel"
        value={form.phone}
        onChange={(event) =>
          setForm({
            ...form,
            phone: event.target.value,
          })
        }
        error={fieldErrors.phone}
      />

      <Input
        label="Password"
        type="password"
        required
        value={form.password}
        onChange={(event) =>
          setForm({
            ...form,
            password: event.target.value,
          })
        }
        error={fieldErrors.password}
      />

      <Input
        label="Confirm Password"
        type="password"
        required
        value={form.password_confirmation}
        onChange={(event) =>
          setForm({
            ...form,
            password_confirmation:
              event.target.value,
          })
        }
        error={fieldErrors.password_confirmation}
      />

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      <Button
        type="submit"
        loading={loading}
        className="w-full"
      >
        Create Account
      </Button>
    </form>

    <p className="mt-4 text-center text-sm text-muted">
      Already have an account?{" "}
      <Link
        href="/login"
        className="font-medium text-primary hover:text-secondary"
      >
        Sign In
      </Link>
    </p>
  </Card>
</div>


);
}
