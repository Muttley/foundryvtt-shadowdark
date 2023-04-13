#!/usr/bin/python3
import glob
import os
import json
import re

dbFolder="../system/packs/_convert"

def slugify(s):
  s = s.lower().strip()
  s = re.sub(r'[^\w\s-]', '', s)
  s = re.sub(r'[\s_-]', '-', s)
  s = re.sub(r'^-+|-+$', '', s)
  return s

for filepath in glob.iglob(dbFolder + "/*.db"):
  filename, file_extension = os.path.splitext(os.path.basename(filepath))
  resultFolder = dbFolder + "/" + filename
  if not os.path.exists(resultFolder):
    os.makedirs(resultFolder)

  with open(filepath, "r") as f:
    lines = f.readlines()
    for line in lines:
      data = json.loads(line)
      print(data['name'])
      with open(resultFolder + "/" + slugify(data['name']) + ".json", "w") as fw:
        json.dump(data, fw, indent='\t')

