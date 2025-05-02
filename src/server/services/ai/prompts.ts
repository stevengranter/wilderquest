export const aiTaxonIdentificationPrompt = `Identify the taxonomic family of the subject.
If the image does not contain a subject you can identify, return "NA".
Be as specific as possible, such as:
- Felidae (cats, including lions, tigers, leopards, jaguars, domestic cats)
- Canidae (dogs, wolves, coyotes, foxes, jackals, dingoes)
- Hominidae (great apes, including humans, chimpanzees, bonobos, gorillas, orangutans)

Once you have determined the family of the subject, be incredibly, specifically, thoroughly in determining its species.
Be as specific as possible, such as:
- Panthera tigris (Tiger, including Bengal tiger, Siberian tiger, Sumatran tiger)
- Canis lupus (Gray wolf, including Arctic wolf, Eurasian wolf, Mexican wolf)
- Loxodonta africana (African bush elephant, distinguished from the smaller African forest elephant)`
