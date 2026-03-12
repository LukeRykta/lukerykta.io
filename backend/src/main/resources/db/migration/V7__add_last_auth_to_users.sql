alter table users
    add column last_auth_at timestamp null after updated_at;

update users
set last_auth_at = coalesce(updated_at, created_at, current_timestamp)
where last_auth_at is null;

alter table users
    modify column last_auth_at timestamp not null default current_timestamp;
