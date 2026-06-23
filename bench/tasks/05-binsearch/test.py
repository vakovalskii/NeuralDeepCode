from solution import bsearch
a=[1,3,5,7,9,11]
assert bsearch(a,7)==3, bsearch(a,7)
assert bsearch(a,1)==0
assert bsearch(a,11)==5
assert bsearch(a,4)==-1
print("ALL PASS")
