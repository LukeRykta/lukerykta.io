create table page_view_events (
    id         bigint primary key auto_increment,
    user_id    bigint null,
    visitor_id varchar(64)  not null,
    route_path varchar(255) not null,
    viewed_at  timestamp    not null default current_timestamp,
    key idx_page_view_events_route_path (route_path),
    key idx_page_view_events_viewed_at (viewed_at),
    key idx_page_view_events_visitor_id (visitor_id),
    constraint fk_page_view_events_user foreign key (user_id) references users(id) on delete set null
) engine=innodb default charset=utf8mb4 collate=utf8mb4_0900_ai_ci;
