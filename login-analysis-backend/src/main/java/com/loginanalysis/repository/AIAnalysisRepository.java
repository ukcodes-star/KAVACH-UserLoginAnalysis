package com.loginanalysis.repository;

import com.loginanalysis.entity.AIAnalysisHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AIAnalysisRepository extends JpaRepository<AIAnalysisHistory, Long> {

    Page<AIAnalysisHistory> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<AIAnalysisHistory> findByCachedUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    List<AIAnalysisHistory> findByCachedAnomalyIdOrderByCreatedAtDesc(Long anomalyId);

    Optional<AIAnalysisHistory> findTopByCachedAnomalyIdOrderByCreatedAtDesc(Long anomalyId);
}
