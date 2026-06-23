from solution import group_anagrams
r = group_anagrams(["eat","tea","tan","ate","nat","bat"])
norm = sorted(sorted(g) for g in r)
assert norm == [["ate","eat","tea"],["bat"],["nat","tan"]], norm
print("ALL PASS")
