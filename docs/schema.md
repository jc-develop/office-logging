# Database Schema

```mermaid
erDiagram
  user_state {
    string in_office
    string out_of_office
    string on_break
  }

  logs {
    uuid id PK
    text name "not null"
    text type "check: login|logout|break"
    text role "check: staff|intern|guest|client|admin"
    user_state state "default: out_of_office"
    text image_url "not null"
    timestamptz created_at "default: now()"
  }

  users {
    text name PK
    text role "not null, check: staff|intern|guest|client|admin"
    user_state state "not null, default: out_of_office"
    timestamptz updated_at "default: now()"
  }

  admin_activity_logs {
    uuid id PK
    text action "not null"
    text details "not null"
    timestamptz created_at "default: now()"
  }

  storage_buckets {
    text id PK "log-images"
    text name
    bool public
  }

  storage_objects {
    text id PK
    text bucket_id FK
    text name
    timestamptz created_at
    text owner
  }

  users ||--o{ logs : "name"
  storage_buckets ||--o{ storage_objects : "bucket_id"
```

## State Machine

```mermaid
stateDiagram-v2
  [*] --> unknown
  unknown --> in_office : login
  out_of_office --> in_office : login
  in_office --> out_of_office : logout
  in_office --> on_break : break
  on_break --> in_office : login
  on_break --> out_of_office : logout

  note right of unknown
    Walk-in roles (guest/client)
    can login as unknown.
    Staff/intern must be
    registered first.
  end note
```

## Roles

```mermaid
quadrantChart
  title User Roles
  x-axis "Walk-in" --> "Registered"
  y-axis "Non-admin" --> "Admin"
  quadrant-1 "Staff"
  quadrant-2 "Admin"
  quadrant-3 "Guest, Client"
  quadrant-4 "Intern"
```

## Data Flow

```mermaid
flowchart LR
  subgraph Kiosk
    A[Person enters name] --> B[get_user_profile]
    B --> C{Is the person\nknown?}
    C -- No, guest/client --> D[validatePerson:\nallowed if role is\nwalk-in]
    C -- No, staff/intern --> E[Reject: must\nregister first]
    C -- Yes --> D
    D --> F[createLog:\ninserts into logs\ntable]
    F --> G[upsert_user_state:\nsyncs to users table]
  end

  subgraph AdminPanel
    H[Admin registers\nstaff/intern] --> I[register_staff_intern_user]
    I --> J[inserts into users\nstate: out_of_office]
    J --> K[createActivityLog]
  end
```

## Access Control (RLS)

```mermaid
flowchart LR
  subgraph public.logs
    L1[INSERT: anon, authenticated]
    L2[SELECT: authenticated only]
  end

  subgraph public.users
    U1[INSERT: anon, authenticated]
    U2[UPDATE: anon, authenticated]
    U3[SELECT: authenticated only]
  end

  subgraph public.admin_activity_logs
    A1[INSERT: anon, authenticated]
    A2[SELECT: authenticated only]
  end

  subgraph storage.objects
    S1[INSERT: anon, authenticated\nif bucket_id = log-images]
    S2[SELECT: anon, authenticated\nif bucket_id = log-images]
  end
```

## RPC Functions

| Function | Returns | Purpose |
|---|---|---|
| `get_user_state(p_name)` | `user_state` | Read a user's current state from `users` table |
| `get_user_profile(p_name)` | `(name, role, state)` | Read role + state, falls back from `users` to `logs` |
| `get_user_suggestions()` | `(name, role)` | Autocomplete list, deduplicated from `users` + `logs` |
| `upsert_user_state(p_name, p_role, p_state)` | `void` | Upsert user's state on each log entry |
| `register_staff_intern_user(p_name, p_role)` | `(name, role, state, updated_at)` | Register a staff/intern with `out_of_office` state |
| `get_staff_intern_users()` | `(name, role, state, updated_at)` | List all staff/intern users |
| `delete_user(p_name)` | `void` | Remove a user from `users` table |
| `rename_user(p_old, p_new)` | `(name, role, state, updated_at)` | Change a user's name (PK) |
| `update_user_role(p_name, p_role)` | `(name, role, state, updated_at)` | Change a user's role |

## Key Rules

- **New users** are created with `state = 'out_of_office'`
- **Walk-in roles** (`guest`, `client`) can self-register by logging in at the kiosk
- **Staff/intern** must be pre-registered via admin panel before they can log in
- The `logs` table records every action; the `users` table stores the current state snapshot
- Photo uploads go to the `log-images` storage bucket
