create table post_likes (
                           post_id    bigint    not null,
                           user_id    bigint    not null,
                           created_at timestamp not null default current_timestamp,
                           primary key (post_id, user_id),
                           key idx_post_likes_user_created (user_id, created_at),
                           constraint fk_post_likes_post foreign key (post_id) references posts(id) on delete cascade,
                           constraint fk_post_likes_user foreign key (user_id) references users(id) on delete cascade
) engine=innodb default charset=utf8mb4 collate=utf8mb4_0900_ai_ci;
