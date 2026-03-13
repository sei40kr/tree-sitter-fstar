module Factorial

open FStar.Mul

let rec factorial (n:nat) : Tot nat =
  if n = 0 then 1
  else n * factorial (n - 1)

val factorial_positive : n:nat -> Lemma (factorial n > 0)
let rec factorial_positive n =
  if n = 0 then ()
  else factorial_positive (n - 1)
