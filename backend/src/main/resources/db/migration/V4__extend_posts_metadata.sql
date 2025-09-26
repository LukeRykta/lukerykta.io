alter table posts
    add column preview_image_url varchar(512) null after content,
    add column external_url varchar(512) null after preview_image_url;
