-- Statische formatie-catalogus. x/y zijn percentages op het veld (0,0 = linksboven,
-- y=100 = eigen doel, y=0 = tegenstanders doel), gebruikt door components/tactics/Pitch.

insert into formations (name, slots) values
('4-3-3', '[
  {"id":"gk","label":"Doel","x":50,"y":92},
  {"id":"rb","label":"RB","x":82,"y":72},
  {"id":"rcb","label":"RCB","x":60,"y":78},
  {"id":"lcb","label":"LCB","x":40,"y":78},
  {"id":"lb","label":"LB","x":18,"y":72},
  {"id":"rcm","label":"RCM","x":68,"y":50},
  {"id":"cm","label":"CM","x":50,"y":56},
  {"id":"lcm","label":"LCM","x":32,"y":50},
  {"id":"rw","label":"RW","x":80,"y":22},
  {"id":"st","label":"ST","x":50,"y":14},
  {"id":"lw","label":"LW","x":20,"y":22}
]'::jsonb),
('4-2-3-1', '[
  {"id":"gk","label":"Doel","x":50,"y":92},
  {"id":"rb","label":"RB","x":82,"y":72},
  {"id":"rcb","label":"RCB","x":60,"y":78},
  {"id":"lcb","label":"LCB","x":40,"y":78},
  {"id":"lb","label":"LB","x":18,"y":72},
  {"id":"rdm","label":"RDM","x":62,"y":58},
  {"id":"ldm","label":"LDM","x":38,"y":58},
  {"id":"ram","label":"RAM","x":78,"y":32},
  {"id":"cam","label":"CAM","x":50,"y":30},
  {"id":"lam","label":"LAM","x":22,"y":32},
  {"id":"st","label":"ST","x":50,"y":14}
]'::jsonb),
('4-4-2', '[
  {"id":"gk","label":"Doel","x":50,"y":92},
  {"id":"rb","label":"RB","x":82,"y":72},
  {"id":"rcb","label":"RCB","x":60,"y":78},
  {"id":"lcb","label":"LCB","x":40,"y":78},
  {"id":"lb","label":"LB","x":18,"y":72},
  {"id":"rm","label":"RM","x":82,"y":46},
  {"id":"rcm","label":"RCM","x":60,"y":50},
  {"id":"lcm","label":"LCM","x":40,"y":50},
  {"id":"lm","label":"LM","x":18,"y":46},
  {"id":"rst","label":"RST","x":60,"y":16},
  {"id":"lst","label":"LST","x":40,"y":16}
]'::jsonb),
('3-5-2', '[
  {"id":"gk","label":"Doel","x":50,"y":92},
  {"id":"rcb","label":"RCB","x":68,"y":78},
  {"id":"cb","label":"CB","x":50,"y":80},
  {"id":"lcb","label":"LCB","x":32,"y":78},
  {"id":"rwb","label":"RWB","x":88,"y":52},
  {"id":"rcm","label":"RCM","x":62,"y":52},
  {"id":"cm","label":"CM","x":50,"y":56},
  {"id":"lcm","label":"LCM","x":38,"y":52},
  {"id":"lwb","label":"LWB","x":12,"y":52},
  {"id":"rst","label":"RST","x":60,"y":16},
  {"id":"lst","label":"LST","x":40,"y":16}
]'::jsonb);
