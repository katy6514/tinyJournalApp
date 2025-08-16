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
}: {
  type: "submit" | "reset" | "button" | undefined;
}) {
  return (
    <Button type={type} variant="dark">
      Save Entry
    </Button>
  );
}
