import { PencilIcon, PlusIcon } from "@heroicons/react/24/outline";

import { Button } from "../button";

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
