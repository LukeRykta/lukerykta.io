insert into users (provider, provider_id, email, display_name, avatar_url)
select 'SYSTEM', 'project-seed', 'projects@lukerykta.io', 'Project Showcase Bot', null
where not exists (select 1 from users where provider = 'SYSTEM' and provider_id = 'project-seed');

set @seed_author := (select id from users where provider = 'SYSTEM' and provider_id = 'project-seed');

insert into posts (author_id, type, title, content, preview_image_url, external_url, like_count)
values
    (@seed_author, 'PROJECT', 'Nebula Canvas',
     'A GPU-accelerated particle visualizer that maps live audio to volumetric nebula formations.',
     'https://images.unsplash.com/photo-1526312426976-f4d754fa9bd6?auto=format&fit=crop&w=1400&q=80',
     'https://github.com/lukerykta/nebula-canvas',
     48),
    (@seed_author, 'PROJECT', 'Aurora Synth',
     'A browser-based synth with WebAudio modulation routing, MIDI support, and a generative preset engine.',
     'https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?auto=format&fit=crop&w=1400&q=80',
     'https://github.com/lukerykta/aurora-synth',
     73),
    (@seed_author, 'PROJECT', 'Lumen Trails',
     'A lighting design toolkit that simulates ray behavior in virtual venues for rapid stage prototyping.',
     'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=80',
     'https://github.com/lukerykta/lumen-trails',
     35),
    (@seed_author, 'PROJECT', 'Atlas AR',
     'An AR-first progressive web app that overlays real-time geospatial analytics onto physical spaces.',
     'https://images.unsplash.com/photo-1483478550801-ceba5fe50e8e?auto=format&fit=crop&w=1400&q=80',
     'https://github.com/lukerykta/atlas-ar',
     62);
