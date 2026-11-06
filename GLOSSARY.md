# BreedersDB

Data collection and analysis for fruit tree breeding: tracking breeding material and recording what is observed or done to it.

## Attributing

**Attributed entity**:
The plant, plant group, cultivar or lot that an attribution is recorded against. Each attribution belongs to exactly one.
_Avoid_: Object, target

**Attribute**:
A definition of something that can be recorded about an attributed entity, such as "Fruit size" or "Lab report". It has a data type and a cardinality.
_Avoid_: Property, trait, field

**Attribution**:
One recording session for one attributed entity at one date by one author. It groups the attribution values entered together.
_Avoid_: Assessment, submission

**Attribution value**:
The single datum recorded for one attribute within an attribution.
_Avoid_: Measurement, entry

**Note**:
Optional extra information attached to an attribution value, either a text note or a photo note. A note is never the value itself.

**Photo**:
An image that is the value of an attribute with the photo data type.
_Avoid_: Picture, image (when meaning the value)

**Photo note**:
A photo attached as a note to an attribution value of any attribute that is not itself a photo attribute.

**Attachment**:
A file of any kind that is the value of an attribute with the attachment data type. Its original filename is not part of the domain.
_Avoid_: Document, file upload

## Cardinality

**Cardinality**:
How many attribution values of one attribute an attributed entity may have: repeatable or unique.

**Repeatable**:
An attributed entity may have any number of values of the attribute. This is the default.

**Unique**:
An attributed entity may have at most one value of the attribute. Values on other entities in the breeding hierarchy (e.g. the plant's cultivar) do not count.
_Avoid_: Single, one-time

**Collision**:
An attempt to record a value of a unique attribute for an attributed entity that already has one.
_Avoid_: Conflict, duplicate

**Collision behavior**:
What happens on a collision: **block** (the new value is rejected) or **replace** (the existing value, including its notes, is removed and the new one kept, regardless of either's date).
