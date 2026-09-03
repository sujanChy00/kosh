import { Link, useNavigate } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";

export default function UserMenu() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <div>loading</div>;
  }

  if (!session) {
    return (
      <Link to="/login">
        <button>Sign In</button>
      </Link>
    );
  }

  return (
    <div>
      <p> {session.user.name}</p>
      <button
        onClick={() => {
          authClient.signOut({
            fetchOptions: {
              onSuccess: () => {
                navigate({
                  to: "/",
                });
              },
            },
          });
        }}
      >
        Logout
      </button>
    </div>
  );
}
