#!/usr/bin/python3
import glob
import os
import json
import re

dbFolder="../system/packs"
resultFolder="../system/assets/db/new"

def slugify(s):
  s = s.lower().strip()
  s = re.sub(r'[^\w\s-]', '', s)
  s = re.sub(r'[\s_-]', '-', s)
  s = re.sub(r'^-+|-+$', '', s)
  return s

for filepath in glob.iglob(dbFolder + "/rollable-tables.db"):
  filename, file_extension = os.path.splitext(os.path.basename(filepath))
  resultFile = resultFolder + "/" + filename

  if not os.path.exists(resultFolder):
    os.makedirs(resultFolder)

  with open(filepath, "r") as f:
    lines = f.readlines()
    for line in lines:
      data = json.loads(line)
      # Setup for rollable tables
      newData = {
        "_id": data["_id"],
        "name": data["name"],
        "img": data["img"],
        "description": data["description"],
        "formula": data["formula"],
        "replacement": data["replacement"],
        "displayRoll": data["displayRoll"],
        "results": data["results"],
        "flags": {},
        "sort": 0,
        "ownership": {
          "default": 0
        }
      }
      print(newData)
      print(data['name'])
      with open(resultFolder + "/" + slugify(data['name']) + ".json", "w") as fw:
        json.dump(newData, fw, indent='\t')

