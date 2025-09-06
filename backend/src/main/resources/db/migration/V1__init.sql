-- Base schema (lowercase identifiers to play nice with lower_case_table_names=1)

create table users (
                       id            bigint primary key auto_increment,
                       provider      varchar(32)  not null,
                       provider_id   varchar(191) not null,
                       email         varchar(320) null,
                       display_name  varchar(191) null,
                       avatar_url    varchar(512) null,
                       is_active     tinyint(1)   not null default 1,
                       created_at    timestamp    not null default current_timestamp,
                       updated_at    timestamp    not null default current_timestamp on update current_timestamp,
                       unique key uq_provider_user (provider, provider_id),
                       unique key uq_email (email)
) engine=innodb default charset=utf8mb4 collate=utf8mb4_0900_ai_ci;

create table roles (
                       id   bigint primary key auto_increment,
                       name varchar(64) not null unique
) engine=innodb default charset=utf8mb4 collate=utf8mb4_0900_ai_ci;

create table user_roles (
                            id          bigint primary key auto_increment,
                            user_id     bigint not null,
                            role_id     bigint not null,
                            assigned_at timestamp not null default current_timestamp,
                            unique key uq_user_role (user_id, role_id),
                            key idx_user_roles_user (user_id),
                            key idx_user_roles_role (role_id),
                            constraint fk_ur_user foreign key (user_id) references users(id) on delete cascade,
                            constraint fk_ur_role foreign key (role_id) references roles(id) on delete restrict
) engine=innodb default charset=utf8mb4 collate=utf8mb4_0900_ai_ci;
