require 'bundler/inline'
require 'benchmark'
gemfile do
      source 'https://rubygems.org'
      gem 'parser_combinator_dsl'
end

def o1(f)
  ["\# 1^d: "] + f
end
def o2(f)
  ["\# 2^d: ", "~ "] + f
end
def imp(f1,f2)
  ['('] + f1 + [' => '] + f2 + [')']
end
def conj(f1,f2)
  ['('] + f1 + [', '] + f2 + [')']
end
def disj(f1,f2)
  ['('] + f1 + ['; '] + f2 + [')']
end
def equi(f1,f2)
  ['('] + f1 + [' <=> '] + f2 + [')']
end
def p1(f)
  ["(* 1^d: "] + f + [")"]
end
def p2(f)
  ["(* 2^d: ~ "] + f + [")"]
end
def pm(f)
  ['('] +p1(f) + [","] + p2(f)  +[')']
end
def ob(f)
  ['('] + o1(f) + [","] + o2(f) +[')']
end
def pbi(f1,f2)
  ["("] + f1 + [" =>", "("] + pm(f2) + ["))"]
end
def pb(f1,f2)
  ["(("] + pbi(f1,f2) + ["),("] + imp(o1(pm(f1)),o1(pm(f2))) + ['))']
end
def nbi(f1,f2)
  ["("] + f1 + [" =>", "("] + ob(f2) + ["))"]
end
def nb(f1,f2)
  ["(("] + nbi(f1,f2) + ["),("] + imp(o1(ob(f1)),o1(ob(f2))) + ['))']
end
def nb22(f1,f2)
  ["(\# 1^d: "] + nbi(f1,f2) + [","] + ["\# 1^d: "] + nbi(ob(f1),f2) + [","]  + nbi(f1,f2) + [")"]
end
def pp(f)
  ["(~ \# 2^d: "] + f + [")"]
end
def nec(f1,f2)
  ["("] + ob(f1) + [", "] + pp(f2)  + [" => "] +  ob(f2) + [")"]
end
def ax
  "(#{o1(['r'])}, #{o2(['r'])})"
end
def axs
  "(#{ax}, (\# 1^d: #{ax}),(\# 2^d: #{ax}))"
end
def term(f)
  f + [', ']
end

$convs = [
  # Id(Ob(D));
  o1(ob(['d'])),
  # D0.1 ⇒ Ob D1;
  nb(['d01'],['d1']),
  # D0.2 ⇒ Ob D2;
  nb(['d02'],['d2']),
  # (¬D0.1 ∧ ¬D0.2) ⇒ Ob D3;
  nb(conj(['(~ d01)'],['(~ d02)']),['d3']),
  # D ⇒ Ob G;
  nb(['d'],['g']),
  # D1 ⇒ Ob D1.3;
  nb(['d1'],['d13']),
  # (D1 ∧ ¬D1.1) ⇒ Ob D1.2;
  nb(['d1, (~ d11)'],['d12']),
  # (D1 ∧ ¬D1.2) ⇒ Ob D1.1;
  nb(['d1, (~ d12)'],['d11']),
  # (D1 ∧ ¬D1.4) ⇒ Ob D1.5;
  nb(['d1, (~ d14)'], ['d15']),
  # (D1 ∧ ¬D1.5) ⇒ Ob D1.4;
  nb(['d1,(~ d15)'],['d14']),
  # (¬D ∨ ¬G) ⇒ Pm E1;
  pb(['(~ d)'],['e1']),
  # (¬D) ⇒ Pm E2;
  pb(['(~ d)'],['e2']),
  # D0.1 → ¬D0.2;
  imp(['d01'],['(~ d02)']),
  # D1 → ¬D2;
  imp(['d1'],['(~ d2)']),
  # D1 → ¬D3;
  imp(['d1'],['(~ d3)']),
  # D2 → ¬D3;
  imp(['d2'],['(~ d3)']),
  # D → [(D0.1 → (D1 ∧ (D1.1 ≡ ¬D1.2) ∧ D1.3 ∧ (D1.4 ≡ ¬D1.5))) ∧ (D0.2 → D2) ∧ ((¬D0.1 ∧ ¬D0.2) → D3)]
  imp(['d'],conj(imp(['d01'],conj(['d1'],(conj(equi(['d11'],['(~ d12)']),conj(['d13'], equi(['d14'],['(~ d15)'])))))),conj(imp(['d02'],['d2']), imp(conj(['(~ d01)'],['(~ d02)']),['d3'])))),
  # Pm E1 → Pm T1
  #imp(pm(['e1']),['t1']),
  # Pm E1 ∧ T1 ⇒ Ob D4;
  #nb(conj(pm(['e1']),['t1']),['d4']),
  # Pm E1 ∧ ¬D ∧ ¬D4 ⇒ Pm V
  #pb(conj(pm(['e1']), conj(['(~ d)'],disj(conj(['(~ d4)'], ['t1']),['d5']))),['v'])
]
def un
  $convs.reverse.drop(1).reverse.map {|x| term(x) } + $convs.last
end

parser = Grammar.build do

  rule(:bopen)        { (one "[") >= whitespace }
  rule(:bclose)       { whitespace <= (one "]") }
  rule(:popen)        { (one "(") >= whitespace }
  rule(:pclose)       { whitespace <= (one ")") }
  rule(:comma)        { whitespace <= (one ",") >= whitespace }

  rule(:negs)         { (one "~") >> whitespace }
  rule(:uns)          { (one "u") >> (one "n") >= whitespace }
  rule(:ots)          { (one "O") >> (one "b") >= whitespace }
  rule(:pms)          { (one "P") >> (one "m") >= whitespace }
  rule(:o1s)          { (one "I") >> (one "d") >= whitespace }
  rule(:o2s)          { (one "A") >> (one "w") >= whitespace }
  rule(:nbs)          { (one "N") >> (one "O") >= whitespace }
  rule(:pbs)          { (one "N") >> (one "P") >= whitespace }
  rule(:necs)         { (one "N") >> (one "C") >= whitespace }
  rule(:ors)          { whitespace <= (one ";") >= whitespace }
  rule(:ands)         { whitespace <= (one ",") >= whitespace }
  rule(:imps)         { whitespace <= (one "=") >> (one ">") >= whitespace }

  rule(:list_body)    { (rule :formula_group) | empty }
  rule(:list)         { (rule :bopen) <= (rule :list_body) >= (rule :bclose) }
  rule(:empty_list)   { (rule :bopen) <= empty >= (rule :bclose) }
  rule(:formula_group){ ((rule :formula) >> (rule :comma) >> (rule :formula_group)) | (rule :formula)  }

  rule(:formula)      { (rule :un) | (rule :unary) | (rule :binary) | (rule :atom) }
  rule(:un)           { seq (rule :uns), lambda {|s| un()} }
  rule(:atom)         { regex(/[A-Za-z][A-Za-z\d]*/) }
  rule(:unary)        { (rule :popen) >> ((rule :neg) | (rule :permitted) | (rule :ought) | (rule :o1) | (rule :pb) | (rule :nb) | (rule :nec)) >> (rule :pclose)  }
  rule(:neg)          { (rule :negs) >> (rule :formula)}
  rule(:permitted)    { seq (rule :pms), (rule :formula),
                        lambda {|ot,f| pm(f)}}
  rule(:ought)        { seq (rule :ots), (rule :formula),
                        lambda {|ot,f| ob(f)}}
  rule(:o1)           { seq (rule :o1s), (rule :formula),
                        lambda {|ot,f| o1(f)}}
  rule(:pb)           { seq (rule :pbs), (rule :formula), whitespace, (rule :formula),
                        lambda {|ot,f1, s, f2| pb(f1,f2)}}
  rule(:nb)           { seq (rule :nbs), (rule :formula), whitespace, (rule :formula),
                        lambda {|ot,f1, s, f2| nb(f1,f2)}}
  rule(:nec)          { seq (rule :necs), (rule :formula), whitespace, (rule :formula),
                        lambda {|ot,f1, s, f2| nec(f1,f2)}}
  rule(:binary)       { (rule :popen) >> ((rule :or) | (rule :and) | (rule :imp)) >> (rule :pclose)  }
  rule(:or)           { seq (rule :formula), (rule :ors), (rule :formula),
                        lambda {|f1,o,f2| f1 + [";"] + f2} }
  rule(:and)          { seq (rule :formula), (rule :ands), (rule :formula),
                        lambda {|f1,o,f2| f1 + [","] + f2} }
  rule(:imp)          { seq (rule :formula), (rule :imps), (rule :formula),
                        lambda {|f1,o,f2| f1 + ["=>"] + f2} }

  rule(:problem_body) { seq (rule :list), (rule :comma), (rule :formula),
                        lambda {|ls, c, f| "f(((#{ls.join('')}) => #{f.join('')}))."} }
  rule(:simple_problem_body) { seq (rule :empty_list), (rule :comma), (rule :formula),
                               lambda {|ls, c, f| "f(#{f.join('')})."} }
  rule(:problem)      { (rule :popen) <= ((rule :simple_problem_body) | (rule :problem_body)) >= (rule :pclose) }

  # The last rule is always the starting rule, but let's make things clear
  start(:problem)
end

#puts parser.run('([],(~ (Ob (a | (~ a)))))')
puts ARGV[0]
puts parser.run(ARGV[0]).output
#File.open('problem', 'w') { |file| file.write(parser.run(ARGV[0]).output)}
#time = Benchmark.measure {
#  system("./mleancop.sh problem 1")
# }
#STDERR.puts "Took #{time.real} seconds"
