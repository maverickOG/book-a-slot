# Technical Note

## Schema and normalisation

The database has three main tables: `users`, `bookings`, and `reviews`. I kept the schema fairly simple because these are the main things the application needs to store. I also decided not to make a separate `slots` table. A booking with `status = pending` and `customer_id = NULL` acts as an available slot. When a customer books it, the same row is updated with the customer and changes to `confirmed`.

I preferred this because it avoids having two tables representing something closely related and makes the booking flow simpler. The downside is that `bookings` represents both an available slot and an actual booking depending on its state. The database also handles valid booking times, ratings between 1 and 5, and making sure a booking can only have one review.

Reviews are separate from bookings because a review happens after a booking is completed. `booking_id` is unique, so the same booking cannot have multiple reviews. The nullable `summary` field is there for the review summarisation feature that can be processed later.

## RBAC: a fourth role or nested organisations

The current system stores one role for each user using a PostgreSQL enum. The API uses dependencies such as `require_admin`, `require_provider`, and `require_customer` to control which endpoints each role can access. There are also checks for whether a user actually owns a particular booking.

Adding another role would not require changing the whole system. I would add the new role through a database migration, create the required permission dependency, and update the places where the API checks the user's role.

Nested organisations would be a bigger change. The current design assumes that a user has one role globally, so I would need an `organisations` table and a membership table that stores the user's role within each organisation. Bookings would also need to belong to an organisation. Ownership checks would then need to look at organisation membership instead of only comparing user IDs.

## Production-safety gaps

The application works for the current project, but there are still things I would change before calling it production-ready.

The API currently runs through Uvicorn without a reverse proxy or TLS. Docker Compose also uses development database credentials. These are fine for local development, but real credentials should be injected through a proper secrets mechanism and should not be committed to the repository.

The API container currently runs the Alembic migrations when it starts. This is convenient here, but with multiple API instances I would run migrations as a separate deployment step instead.

Authentication tokens are stored directly in the database and do not have an expiry or refresh mechanism. Redis is used as a queue for review summarisation, but there is currently no worker consuming it, so the `summary` field is not populated. The bookings endpoint also does not have pagination.

Most tests use SQLite and a Redis fake, with a separate live test using PostgreSQL and Redis; production would need more extensive integration, concurrency, security, and infrastructure testing.

