create table user_visit_events (
    id         bigint primary key auto_increment,
    user_id    bigint    not null,
    visited_at timestamp not null default current_timestamp,
    key idx_user_visit_events_user (user_id),
    key idx_user_visit_events_visited_at (visited_at),
    constraint fk_user_visit_events_user foreign key (user_id) references users(id) on delete cascade
) engine=innodb default charset=utf8mb4 collate=utf8mb4_0900_ai_ci;
