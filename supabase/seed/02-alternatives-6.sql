insert into public.alternatives
  (id, slug, original_id, name, brand, price_gbp, blurb,
   auto_image_url, image_credit, pros, cons, aliases, popularity,
   match_quality, search_query, verdict, gallery)
values
('alt-fz10','biyang-fz-10-fuzz-star','org-big-muff','Biyang FZ-10 Fuzz Star','Biyang',45,'Muff-voiced fuzz with a socketed op-amp for tweaking.',NULL,NULL,ARRAY['Big Muff sustain and scoop at half the price','Socketed chip lets you change the character','Heavy metal chassis and true bypass']::text[],ARRAY['Much larger than a compact pedal','Patchy UK distribution','Less refined top end than a genuine Muff']::text[],ARRAY['Biyang FZ-10']::text[],40,80,NULL,NULL,'{}'),
('alt-eno-bmf','eno-bmf','org-big-muff','ENO BMF','ENO',35,'Direct Big Muff clone in a small metal box.',NULL,NULL,ARRAY['Faithful Muff voicing — the sustain and scoop are both there','Metal enclosure with true bypass','Around a third of the price of an NYC Big Muff']::text[],ARRAY['No UK distribution or support','Build consistency varies between units','No resale value']::text[],'{}',38,85,NULL,NULL,'{}'),
('alt-behringer-vd1','behringer-vintage-distortion','org-big-muff','Behringer Vintage Distortion','Behringer',29,'The cheapest route to a Muff-style wall of fuzz.','https://m.media-amazon.com/images/I/71BUcnNZ6fL._AC_SL600_.jpg','amazon',ARRAY['Close to the Big Muff''s sustain and scoop for a third of the money','Familiar three-knob layout','Cheap enough to treat as disposable']::text[],ARRAY['Plastic enclosure and footswitch','Buffered bypass','Fizzier and thinner than a genuine Muff']::text[],ARRAY['Behringer VD1 Vintage Distortion']::text[],62,82,NULL,NULL,'{}'),
('alt-mosky-big-fuzz','mosky-big-fuzz','org-big-muff','Mosky Big Fuzz','Mosky',29,'Multiple Muff variants selectable in one small pedal.','https://m.media-amazon.com/images/I/71TmDj83Z4L._AC_SL600_.jpg','amazon',ARRAY['Switches between several Muff voicings — Triangle, Ram''s Head and Russian territory','Far more range than any single Muff for the price','Metal enclosure and true bypass']::text[],ARRAY['None of the modes is quite as good as the pedal it imitates','Small knobs are fiddly','Brand support is essentially non-existent']::text[],'{}',56,78,NULL,NULL,'{}'),
('alt-eno-bmf-black','eno-bmf-black-russian','org-black-russian','ENO BMF Black Russian','ENO',35,'Clone of the darkest Muff, for a fifth of the going rate.',NULL,NULL,ARRAY['Copies the Sovtek darkness and compression rather than the NYC voicing','Roughly a fifth of what a used Black Russian costs','Metal enclosure and true bypass']::text[],ARRAY['Lacks the sheer low-end weight of the original','No UK support','Graphics are a crude imitation of the Sovtek box']::text[],'{}',36,82,NULL,NULL,'{}'),
('alt-matcha-cream','tone-city-matcha-cream','org-green-russian','Tone City Matcha Cream','Tone City',45,'Green Russian voicing shrunk into a micro enclosure.','https://thumbs.static-thomann.de/thumb/thumb600x600/pics/prod/537704.jpg','thomann',ARRAY['Tight, punchy low end that tracks the Green Russian closely','Micro footprint — a fraction of the board space of a Muff','All-metal build and true bypass']::text[],ARRAY['No battery option','Micro knobs make fine adjustment awkward','Slightly less sustain than the full-size original']::text[],ARRAY['Tone City Matcha Cream Fuzz']::text[],60,84,NULL,NULL,ARRAY['https://thumbs.static-thomann.de/thumb/thumb600x600/pics/prod/537704.jpg']::text[])
on conflict (id) do update set
  slug = excluded.slug,
  original_id = excluded.original_id,
  name = excluded.name,
  brand = excluded.brand,
  price_gbp = excluded.price_gbp,
  blurb = excluded.blurb,
  auto_image_url = excluded.auto_image_url,
  image_credit = excluded.image_credit,
  pros = excluded.pros,
  cons = excluded.cons,
  aliases = excluded.aliases,
  popularity = excluded.popularity,
  match_quality = excluded.match_quality,
  search_query = excluded.search_query,
  verdict = excluded.verdict,
  gallery = excluded.gallery;
