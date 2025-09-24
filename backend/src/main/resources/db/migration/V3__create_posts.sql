-- Posts table stores milestones, projects, etc.

create table posts (
                       id          bigint primary key auto_increment,
                       author_id   bigint       not null,
                       type        varchar(32)  not null,
                       title       varchar(191) not null,
                       content     text         not null,
                       like_count  int          not null default 0,
                       created_at  timestamp    not null default current_timestamp,
                       updated_at  timestamp    not null default current_timestamp on update current_timestamp,
                       key idx_posts_author (author_id),
                       key idx_posts_type (type),
                       constraint fk_posts_author foreign key (author_id) references users(id) on delete cascade
) engine=innodb default charset=utf8mb4 collate=utf8mb4_0900_ai_ci;
