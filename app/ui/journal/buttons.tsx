import { PencilIcon, PlusIcon } from "@heroicons/react/24/outline";

import { Button } from "../button";

export function AddEntry() {
  return (
    <Button href={"/journal/create"} variant="dark" icon={<PlusIcon />}>
      Add Entry
    </Button>
  );
}

export function EditEntry({ id }: { id: string }) {
  return (
    <Button href={`/journal/${id}/edit`} icon={<PencilIcon />} variant="light">
      Edit
    </Button>
  );
}

export function FormButton({
  type,
  children,
}: {
  type: "submit" | "reset" | "button" | undefined;
  children: string;
}) {
  return (
    <Button type={type} variant="dark">
      {children}
    </Button>
  );
}

export function RedirectLink({
  href,
  children,
}: {
  href: string;
  children: string;
}) {
  return (
    <Button href={href} variant="light">
      {children}
    </Button>
  );
}
